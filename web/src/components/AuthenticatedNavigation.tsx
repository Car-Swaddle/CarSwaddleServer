import { Navbar, Container, Nav } from 'react-bootstrap'
import CarSwaddleLogo from './CarSwaddleLogo'

type AuthenticatedNavigationProps = {
    tab?: string,
    onTabSelect?: (tab: string | undefined | null) => void
}

export default function AuthenticatedNavigation({ tab, onTabSelect }: AuthenticatedNavigationProps) {

    return (
        <Container>
            <Navbar bg="white" expand="sm">
                <Container>
                    <Navbar.Brand href="/affiliate">
                        <CarSwaddleLogo height='50px' />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav activeKey={tab} onSelect={(selectedKey) => {
                            if (onTabSelect) {
                                onTabSelect(selectedKey);
                            }
                        }}>
                            <Nav.Link href="/affiliate">Affilate</Nav.Link>
                            <Nav.Link href="/transactions">Transactions</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </Container>
    )

}